import * as React from 'react';
import { DuckCmpProps } from 'saga-duck';
import Duck, { Data } from './SpanDetailDuck';
import {
  Annotation,
  ANNOTATION_MAP,
  Log,
  SPAN_DETAIL_TAB as TAB,
  SPAN_DETAIL_TAB_MAP as MAP,
  Tag,
  TAG_GROUP,
  TAG_GROUP_NAME,
} from '../types';
import {
  Bubble,
  Col,
  Collapse,
  Drawer,
  Form,
  FormItem,
  FormText,
  Icon,
  Row,
  Table,
  TabPanel,
  Tabs,
  Text,
} from 'tea-component';
import { convertTreeTags, getRecordRelations } from '../utils';
import insertCSS from '@src/common/helpers/insertCSS';
import formatDate from '@src/common/util/formatDate';
import CopyableText from '@src/common/components/CopyableText';
import { expandable, indentable, scrollable } from 'tea-component/lib/table/addons';
import CodeMirrorBox from '@src/common/components/CodeMirrorBox';

insertCSS(
  'span-deatil',
  `.info-table{
  border-bottom: 1px solid #e5e5e5;
}
.tag-info table .tr__masterrow{
  background: #f5f5f5;
}
.error-stack .tea-accordion__header-title{
  font-weight: 500;
}`,
);

const tabs = [TAB.BASE, TAB.TAG, TAB.ORIGIN].map(id => {
  return {
    id,
    label: MAP[id],
  };
});

const TABLE_HEIGHT = 1000;

interface TabProps {
  data: Data;
}

class BaseInfo extends React.Component<TabProps> {
  render() {
    const { data } = this.props;
    const { client, server, annotationList } = data;

    const noClient = annotationList?.every(x => x.value !== ANNOTATION_MAP.cs && x.value !== ANNOTATION_MAP.cr);
    const noServer = annotationList?.every(x => x.value !== ANNOTATION_MAP.ss && x.value !== ANNOTATION_MAP.sr);

    const ss = (annotationList?.find(x => x.value === ANNOTATION_MAP.ss) || {}) as Annotation;
    const sr = (annotationList?.find(x => x.value === ANNOTATION_MAP.sr) || {}) as Annotation;
    const cs = (annotationList?.find(x => x.value === ANNOTATION_MAP.cs) || {}) as Annotation;
    const cr = (annotationList?.find(x => x.value === ANNOTATION_MAP.cr) || {}) as Annotation;

    const errorInfos = [
      ...(client?.logs || [])?.map(d => ({
        ...d,
        isClient: true,
      })),
      ...(server?.logs || []).map(d => ({
        ...d,
      })),
    ]?.map(d => {
      const errorKind = d.data?.find(t => t.key === 'error.kind')?.value || '-';
      return {
        ...d,
        errorKind,
        id: `${formatDate(+d.time)} ${d.isClient ? '?????????' : '?????????'} ${errorKind}`,
      };
    });

    return (
      <>
        <h4 style={{ margin: '10px 0' }}>????????????</h4>
        <Table
          bordered='all'
          rowClassName={() => 'info-table'}
          disableHoverHighlight
          records={[{ client, server }]}
          columns={[
            {
              key: 'client',
              header: '???????????????',
              render: () => (
                <Form>
                  <FormItem label={'????????????'}>
                    <FormText>
                      {client?.startTime ? formatDate(+client?.startTime, 'yyyy-MM-dd hh:mm:ss.SSS') : '-'}
                    </FormText>
                  </FormItem>
                  <FormItem label={'?????????'}>
                    <FormText>{client?.endpointName || '-'}</FormText>
                  </FormItem>
                  <FormItem label={'Span ID'}>
                    <FormText>{client?.spanId ?? '-'}</FormText>
                  </FormItem>
                  <FormItem label={'Trace ID '}>
                    <FormText>{client?.traceId || '-'}</FormText>
                  </FormItem>
                  <FormItem label={'???????????? IP'}>
                    <FormText>{client?.localIp || '-'}</FormText>
                  </FormItem>
                </Form>
              ),
            },
            {
              key: 'server',
              header: '???????????????',
              render: () => (
                <Form>
                  <FormItem label={'????????????'}>
                    <FormText>
                      {server?.startTime ? formatDate(+server.startTime, 'yyyy-MM-dd hh:mm:ss.SSS') : '-'}
                    </FormText>
                  </FormItem>
                  <FormItem label={'?????????'}>
                    <FormText>{server?.endpointName || '-'}</FormText>
                  </FormItem>
                  <FormItem label={'Span ID'}>
                    <FormText>{server?.spanId ?? '-'}</FormText>
                  </FormItem>
                  <FormItem label={'Trace ID '}>
                    <FormText>{server?.traceId || '-'}</FormText>
                  </FormItem>
                  <FormItem label={'???????????? IP'}>
                    <FormText>{server?.localIp || '-'}</FormText>
                  </FormItem>
                </Form>
              ),
            },
          ]}
        />
        <h4 style={{ margin: '10px 0' }}>????????????</h4>
        <div className='_tsf-stage'>
          <div className='_tsf-stage-header'>
            <div className='client'>
              {noClient ? 'Unknow Client(IP)' : `${client?.serviceCode || '-'}(${client?.localIp || '-'})`}
            </div>
            <div className='server'>
              {noServer ? 'Unknow Server(IP)' : `${server?.serviceCode || '-'}(${server?.localIp || '-'})`}
            </div>
          </div>
          <div className={`_tsf-stage-body ${noClient ? 'client-shadow' : noServer ? 'server-shadow' : ''}`}>
            <div className='_tsf-stage-body-item'>
              <div className='_tsf-stage-body-item__sides'>
                <p>Client Send</p>
                <p>
                  ???????????? <span className='time'>0ms</span>
                </p>
              </div>
              <div className='_tsf-stage-body-item__middle'>
                <span className='num'>
                  {noClient || !sr.timestamp ? 0 : (sr.timestamp - cs.timestamp).toFixed(2)}
                  ms
                </span>
                <div className='slice  to-server '>
                  <span className='arrow'></span>
                </div>
              </div>
              <div className='_tsf-stage-body-item__sides'>
                <p>Server Receive</p>
                <p>
                  ????????????&nbsp;
                  <span className='time'>
                    {noClient || !sr.timestamp ? 0 : (sr.timestamp - cs.timestamp || 0).toFixed(2)}
                    ms
                  </span>
                </p>
              </div>
            </div>
            <div className='_tsf-stage-body-item'>
              <div className='total-num'>
                <span>{sr.duration?.toFixed(2) || 0}ms</span>
              </div>
              <div className='_tsf-stage-body-item__sides'>
                <p>Client Receive</p>
                <p>
                  ????????????&nbsp;
                  <span className='time'>
                    {noClient || !cr.duration ? 0 : cr.duration.toFixed(2)}
                    ms
                  </span>
                </p>
              </div>
              <div className='_tsf-stage-body-item__middle'>
                <span className='num'>
                  {!ss.timestamp ? 0 : (+cr.timestamp + +cr.duration - (+ss.timestamp + +ss.duration)).toFixed(2)}
                  ms
                </span>
                <span className='status'>?????? {!server?.isError ? '??????' : '??????'}</span>
                <div className={`slice to-client ${!server?.isError ? '' : 'is-error'}`}>
                  <span className='arrow'></span>
                </div>
              </div>
              <div className='_tsf-stage-body-item__sides'>
                <p>Server Send</p>
                <p>
                  ????????????&nbsp;
                  <span className='time'>
                    {((noClient || !sr.timestamp ? 0 : sr.timestamp - cs.timestamp) + sr.duration || 0).toFixed(2)}
                    ms
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
        {errorInfos?.length ? (
          <>
            <h4 style={{ marginTop: 20 }}>????????????</h4>
            <Collapse defaultActiveIds={errorInfos?.map(d => d.id)} className='error-stack'>
              {errorInfos.map(d => (
                <Collapse.Panel key={d.id} id={d.id} title={d.id} style={{ margin: '10px 0', padding: '10px 0' }}>
                  <Form style={{ marginTop: 10 }}>
                    <FormItem label='????????????'>
                      <FormText>{d.errorKind}</FormText>
                    </FormItem>
                    <FormItem label='????????????'>
                      <CodeMirrorBox
                        width={650}
                        height={300}
                        value={d.data?.find(t => t.key === 'stack')?.value || ''}
                        options={{
                          readOnly: true,
                          mode: 'dylan',
                        }}
                      />
                    </FormItem>
                  </Form>
                </Collapse.Panel>
              ))}
            </Collapse>
          </>
        ) : null}
      </>
    );
  }
}

class TagInfo extends React.Component<TabProps, { expandedKeys: Array<string>; cExpandedKeys: Array<string> }> {
  constructor(props) {
    super(props);
    this.state = {
      cExpandedKeys: [TAG_GROUP.system, TAG_GROUP.custom],
      expandedKeys: [TAG_GROUP.system, TAG_GROUP.custom],
    };
  }

  render() {
    const { data } = this.props;
    const { expandedKeys, cExpandedKeys } = this.state;
    const { client, server } = data;
    const clientTags = convertTreeTags(client?.tags);
    const clientRelations = getRecordRelations(clientTags);
    const serverTags = convertTreeTags(server?.tags);
    const serverRelations = getRecordRelations(serverTags);

    return (
      <Row className='tag-info'>
        <Col>
          <Text parent='p' style={{ margin: '10px 0' }}>
            ?????????????????????{client?.serviceCode || '-'}
            <Bubble content='?????? Span ???????????? Client ?????? Server ??????????????????????????????Client ??? Tag ?????????????????????????????????????????? __kind ??? PRODUCER ????????????????????????????????????????????????????????????'>
              <Icon type='info' style={{ marginLeft: 5 }} />
            </Bubble>
          </Text>
          <Table
            bordered
            topTip={
              !client?.tags?.length && (
                <Text reset parent='p' align='center' style={{ paddingTop: 110 }}>
                  {'????????????'}
                </Text>
              )
            }
            records={clientTags || []}
            recordKey='key'
            columns={[
              {
                key: 'key',
                header: 'key',
                width: 160,
                render: (x: Tag) =>
                  Object.values(TAG_GROUP).indexOf(x.key as TAG_GROUP) < 0 ? (
                    <CopyableText text={x.key} />
                  ) : (
                    <Text style={{ fontWeight: 'bold' }}>{TAG_GROUP_NAME[x.key]}</Text>
                  ),
              },
              {
                key: 'value',
                header: 'value',
                render: (x: Tag) =>
                  Object.values(TAG_GROUP).indexOf(x.key as TAG_GROUP) < 0 ? <CopyableText text={x.value} /> : '',
              },
            ]}
            addons={[
              expandable({
                // ?????????????????????
                expandedKeys: cExpandedKeys,
                // ????????????????????????
                expand: record => record.tags || null,
                // ????????????????????????????????????????????????
                onExpandedKeysChange: keys => this.setState({ cExpandedKeys: keys }),
                // ???????????????????????????
                shouldRecordExpandable: record => Boolean(record.tags),
              }),
              scrollable({
                maxHeight: TABLE_HEIGHT,
                minHeight: TABLE_HEIGHT,
              }),
              indentable({
                // ????????????????????????????????????
                targetColumnKey: 'key',
                // ??????????????????
                relations: clientRelations,
              }),
            ]}
          />
        </Col>
        <Col>
          <Text parent='p' style={{ margin: '10px 0' }}>
            ?????????????????????{server?.serviceCode || '-'}
            <Bubble content='?????? Span ???????????? Client ?????? Server ??????????????????????????????Server ??? Tag ????????????????????????????????????????????????????????? __kind ??? CONSUMER ????????????????????????????????????????????????????????????'>
              <Icon type='info' style={{ marginLeft: 5 }} />
            </Bubble>
          </Text>
          <Table
            bordered
            topTip={
              !server?.tags?.length && (
                <Text reset parent='p' align='center' style={{ paddingTop: 110 }}>
                  {'????????????'}
                </Text>
              )
            }
            records={serverTags || []}
            recordKey='key'
            columns={[
              {
                key: 'key',
                header: 'key',
                width: 160,
                render: (x: Tag) =>
                  Object.values(TAG_GROUP).indexOf(x.key as TAG_GROUP) < 0 ? (
                    <CopyableText text={x.key} />
                  ) : (
                    <Text style={{ fontWeight: 'bold' }}>{TAG_GROUP_NAME[x.key]}</Text>
                  ),
              },
              {
                key: 'value',
                header: 'value',
                render: (x: Tag) =>
                  Object.values(TAG_GROUP).indexOf(x.key as TAG_GROUP) < 0 ? <CopyableText text={x.value} /> : '',
              },
            ]}
            addons={[
              expandable({
                // ?????????????????????
                expandedKeys,
                // ????????????????????????
                expand: record => record.tags || null,
                // ????????????????????????????????????????????????
                onExpandedKeysChange: keys => this.setState({ expandedKeys: keys }),
                // ???????????????????????????
                shouldRecordExpandable: record => Boolean(record.tags),
              }),
              scrollable({
                maxHeight: TABLE_HEIGHT,
                minHeight: TABLE_HEIGHT,
              }),
              indentable({
                // ????????????????????????????????????
                targetColumnKey: 'key',
                // ??????????????????
                relations: serverRelations,
              }),
            ]}
          />
        </Col>
      </Row>
    );
  }
}

class LogInfo extends React.Component<TabProps> {
  render() {
    const { data } = this.props;
    const { client, server } = data;
    return (
      <Row>
        <Col>
          <Text parent='p' style={{ margin: '10px 0' }}>
            ?????????????????????{client?.serviceCode || '-'}
            <Bubble content='?????? Span ???????????? Client ?????? Server ??????????????????????????????Client ??? Tag ?????????????????????????????????????????? __kind ??? PRODUCER ????????????????????????????????????????????????????????????'>
              <Icon type='info' style={{ marginLeft: 5 }} />
            </Bubble>
          </Text>
          <Table
            bordered
            topTip={
              !client?.logs?.length && (
                <Text reset parent='p' align='center' style={{ paddingTop: 110 }}>
                  {'????????????'}
                </Text>
              )
            }
            records={client?.logs?.map((item, i) => ({ ...item, id: item.key + i })) || []}
            recordKey='id'
            columns={[
              {
                key: 'key',
                header: 'key',
                width: 160,
                render: (x: Log) => <CopyableText text={x.key} />,
              },
              {
                key: 'value',
                header: 'value',
                render: (x: Log) => <CopyableText text={x.value} />,
              },
            ]}
            addons={[
              scrollable({
                maxHeight: TABLE_HEIGHT,
                minHeight: TABLE_HEIGHT,
              }),
            ]}
          />
        </Col>
        <Col>
          <Text parent='p' style={{ margin: '10px 0' }}>
            ?????????????????????{server?.serviceCode || '-'}
            <Bubble content='?????? Span ???????????? Client ?????? Server ??????????????????????????????Server ??? Tag ????????????????????????????????????????????????????????? __kind ??? CONSUMER ????????????????????????????????????????????????????????????'>
              <Icon type='info' style={{ marginLeft: 5 }} />
            </Bubble>
          </Text>
          <Table
            bordered
            topTip={
              !server?.logs?.length && (
                <Text reset parent='p' align='center' style={{ paddingTop: 110 }}>
                  {'????????????'}
                </Text>
              )
            }
            records={server?.logs?.map((item, i) => ({ ...item, id: item.key + i })) || []}
            recordKey='id'
            columns={[
              {
                key: 'key',
                header: 'key',
                width: 160,
                render: (x: Log) => <CopyableText text={x.key} />,
              },
              {
                key: 'value',
                header: 'value',
                render: (x: Log) => <CopyableText text={x.value} />,
              },
            ]}
            addons={[
              scrollable({
                maxHeight: TABLE_HEIGHT,
                minHeight: TABLE_HEIGHT,
              }),
            ]}
          />
        </Col>
      </Row>
    );
  }
}

class MetaInfo extends React.Component<TabProps> {
  render() {
    const { data } = this.props;
    const { client, server } = data;
    return (
      <Row>
        <Col>
          <Text parent='p' style={{ margin: '10px 0' }}>
            ?????????????????????{client?.serviceCode || '-'}
            <Bubble content='?????? Span ???????????? Client ?????? Server ??????????????????????????????Client ??? Metadata ???????????? Client ???????????????????????????'>
              <Icon type='info' style={{ marginLeft: 5 }} />
            </Bubble>
          </Text>
          <Table
            topTip={
              !client?.baggages?.length && (
                <Text reset parent='p' align='center' style={{ paddingTop: 110 }}>
                  {'????????????'}
                </Text>
              )
            }
            bordered
            records={client?.baggages || []}
            recordKey='key'
            columns={[
              {
                key: 'key',
                header: 'key',
                width: 160,
                render: (x: Tag) => <CopyableText text={x.key} />,
              },
              {
                key: 'value',
                header: 'value',
                render: (x: Tag) => <CopyableText text={x.value} />,
              },
            ]}
            addons={[
              scrollable({
                maxHeight: TABLE_HEIGHT,
                minHeight: TABLE_HEIGHT,
              }),
            ]}
          />
        </Col>
        <Col>
          <Text parent='p' style={{ margin: '10px 0' }}>
            ?????????????????????{server?.serviceCode || '-'}
            <Bubble content='?????? Span ???????????? Client ?????? Server ??????????????????????????????Server ??? Metadata ???????????? Server ???????????????????????????'>
              <Icon type='info' style={{ marginLeft: 5 }} />
            </Bubble>
          </Text>
          <Table
            topTip={
              !server?.baggages?.length && (
                <Text reset parent='p' align='center' style={{ paddingTop: 110 }}>
                  {'????????????'}
                </Text>
              )
            }
            bordered
            records={server?.baggages || []}
            recordKey='key'
            columns={[
              {
                key: 'key',
                header: 'key',
                width: 160,
                render: (x: Tag) => <CopyableText text={x.key} />,
              },
              {
                key: 'value',
                header: 'value',
                render: (x: Tag) => <CopyableText text={x.value} />,
              },
            ]}
            addons={[
              scrollable({
                maxHeight: TABLE_HEIGHT,
                minHeight: TABLE_HEIGHT,
              }),
            ]}
          />
        </Col>
      </Row>
    );
  }
}

class OriginInfo extends React.Component<TabProps> {
  render() {
    const { data } = this.props;
    const { originData } = data;
    return (
      <section style={{ marginTop: 10 }}>
        <CodeMirrorBox height={1000} value={originData} options={{ readOnly: true }} />
      </section>
    );
  }
}

export default class SpanDetail extends React.Component<DuckCmpProps<Duck>, {}> {
  render() {
    const { duck, store, dispatch } = this.props;
    const {
      selectors,
      ducks: { form },
      creators,
    } = duck;
    const visible = selectors.visible(store);
    if (!visible) {
      return <noscript />;
    }

    const data = selectors.data(store);
    const { selectedTab } = form.getAPI(store, dispatch).getFields(['selectedTab']);
    const onTabChange = tab => {
      selectedTab.setValue(tab.id);
    };
    const tab = selectedTab.getValue() || TAB.BASE.toString();

    return (
      <Drawer size='l' title={data.title} visible={visible} onClose={() => dispatch(creators.hide())}>
        <Tabs tabs={tabs} activeId={tab} onActive={onTabChange}>
          <TabPanel id={TAB.BASE}>
            <BaseInfo data={data} />
          </TabPanel>
          <TabPanel id={TAB.TAG}>
            <TagInfo data={data} />
          </TabPanel>
          <TabPanel id={TAB.LOG}>
            <LogInfo data={data} />
          </TabPanel>
          <TabPanel id={TAB.META}>
            <MetaInfo data={data} />
          </TabPanel>
          <TabPanel id={TAB.ORIGIN}>
            <OriginInfo data={data} />
          </TabPanel>
        </Tabs>
      </Drawer>
    );
  }
}
